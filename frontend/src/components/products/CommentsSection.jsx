import { useState, useEffect } from 'react';
import { getComments, postComment, voteComment } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './CommentsSection.css';

function CommentNode({ node, productSlug, currentUserId, depth = 0, onRefresh }) {
    const { isAuthenticated } = useAuth();
    const [replying, setReplying]   = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [votes, setVotes] = useState({
        useful:     Number(node.votes_useful     ?? 0),
        not_useful: Number(node.votes_not_useful ?? 0),
    });

    async function handleReply() {
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            await postComment(productSlug, replyText.trim(), node.id);
            setReplyText('');
            setReplying(false);
            onRefresh();
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleVote(useful) {
        if (!isAuthenticated) return;
        try {
            await voteComment(node.id, useful);
            setVotes((prev) => ({
                useful:     useful ? prev.useful + 1 : prev.useful,
                not_useful: !useful ? prev.not_useful + 1 : prev.not_useful,
            }));
        } catch (e) {
            console.error(e);
        }
    }

    const isOwn = String(node.user_id) === String(currentUserId);
    const indent = Math.min(depth, 4);

    return (
        <div
            className={`comment-node depth-${indent}`}
            style={{ '--depth': indent }}
        >
            <div className="comment-header">
                <span className="comment-author">{node.author}</span>
                <span className="comment-date">
                    {new Date(node.created_at).toLocaleDateString('es-MX', {
                        day: '2-digit', month: 'short', year: 'numeric',
                    })}
                </span>
            </div>

            <p className="comment-body">{node.body}</p>

            <div className="comment-actions">
                {isAuthenticated && (
                    <button
                        className="comment-reply-btn"
                        onClick={() => setReplying((r) => !r)}
                    >
                        {replying ? 'Cancelar' : '↩ Responder'}
                    </button>
                )}
                <div className="comment-votes">
                    <button
                        className="vote-btn vote-btn--useful"
                        onClick={() => handleVote(true)}
                        disabled={!isAuthenticated}
                        title="Útil"
                    >
                        👍 {votes.useful}
                    </button>
                    <button
                        className="vote-btn vote-btn--not"
                        onClick={() => handleVote(false)}
                        disabled={!isAuthenticated}
                        title="No útil"
                    >
                        👎 {votes.not_useful}
                    </button>
                </div>
            </div>

            {replying && (
                <div className="comment-reply-box">
                    <textarea
                        className="comment-textarea"
                        placeholder={`Respondiendo a ${node.author}…`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                    />
                    <button
                        className="comment-submit-btn"
                        onClick={handleReply}
                        disabled={submitting || !replyText.trim()}
                    >
                        {submitting ? 'Enviando…' : 'Responder'}
                    </button>
                </div>
            )}

            {node.children?.length > 0 && (
                <div className="comment-children">
                    {node.children.map((child) => (
                        <CommentNode
                            key={child.id}
                            node={child}
                            productSlug={productSlug}
                            currentUserId={currentUserId}
                            depth={depth + 1}
                            onRefresh={onRefresh}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CommentsSection({ productSlug }) {
    const { isAuthenticated } = useAuth();
    const [tree, setTree]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const currentUserId = localStorage.getItem('userId');

    async function load() {
        setLoading(true);
        try {
            const roots = await getComments(productSlug);
            setTree(roots);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, [productSlug]);

    async function handlePost() {
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            await postComment(productSlug, newComment.trim());
            setNewComment('');
            load();
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    }

    function countNodes(nodes) {
        let total = 0;
        const queue = [...nodes];
        while (queue.length) {
            const n = queue.shift();
            total++;
            if (n.children?.length) queue.push(...n.children);
        }
        return total;
    }

    const total = countNodes(tree);

    return (
        <section className="comments-section">
            <h3 className="comments-title">
                Comentarios
                {total > 0 && <span className="comments-count">{total}</span>}
            </h3>

            {isAuthenticated ? (
                <div className="comment-new">
                    <textarea
                        className="comment-textarea"
                        placeholder="Escribe un comentario…"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                    />
                    <button
                        className="comment-submit-btn"
                        onClick={handlePost}
                        disabled={submitting || !newComment.trim()}
                    >
                        {submitting ? 'Publicando…' : 'Publicar comentario'}
                    </button>
                </div>
            ) : (
                <p className="comments-login-hint">
                    Inicia sesión para dejar un comentario.
                </p>
            )}

            {loading && <p className="comments-loading">Cargando comentarios…</p>}

            {!loading && tree.length === 0 && (
                <p className="comments-empty">Sé el primero en comentar.</p>
            )}

            {!loading && tree.length > 0 && (
                <div className="comment-tree">
                    {tree.map((root) => (
                        <CommentNode
                            key={root.id}
                            node={root}
                            productSlug={productSlug}
                            currentUserId={currentUserId}
                            depth={0}
                            onRefresh={load}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}